
"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where, writeBatch } from "firebase/firestore";
import { SubscriptionsDataTable } from "@/components/dashboard/admin/subscriptions/subscriptions-data-table";
import { columns as defineSubscriptionColumns } from "@/components/dashboard/admin/subscriptions/subscriptions-table-columns";
import { SubscriptionFormDialog } from "@/components/dashboard/admin/subscriptions/subscription-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

async function fetchSubscriptionPlansFromFirestore(): Promise<SubscriptionPlan[]> {
  const plansCol = collection(db, "subscriptions");
  const planSnapshot = await getDocs(plansCol);
  const planList = planSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SubscriptionPlan));
  return planList;
}

// TODO: Implement this if subscriptions are directly linked to users or services in a way that prevents deletion
// async function isSubscriptionPlanInUse(planId: string): Promise<boolean> {
//   // Example: Check if any user has this subscriptionPlanId
//   // const usersCol = collection(db, "users");
//   // const q = query(usersCol, where("subscriptionPlanId", "==", planId));
//   // const querySnapshot = await getDocs(q);
//   // return !querySnapshot.empty;
//   return false; // Placeholder
// }

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);

  const { toast } = useToast();

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPlans = await fetchSubscriptionPlansFromFirestore();
      setPlans(fetchedPlans);
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error);
      let description = "Could not fetch subscription plans.";
      if (error.message) {
        description += ` Message: ${error.message}`;
      }
      if (error.code) { // Log Firebase specific error code
        description += ` Firebase Code: ${error.code}`;
        console.error("Firebase error details:", error);
      }
      toast({ variant: "destructive", title: "Error Loading Plans", description });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleAddPlanClick = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeletePlanAttempt = async (plan: SubscriptionPlan) => {
    // const planInUse = await isSubscriptionPlanInUse(plan.id!);
    // if (planInUse) {
    //   toast({ variant: "destructive", title: "Plan In Use", description: `The "${plan.name}" plan is currently in use and cannot be deleted.` });
    //   return;
    // }
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete || !planToDelete.id) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "subscriptions", planToDelete.id));
      setPlans(prevPlans => prevPlans.filter(p => p.id !== planToDelete.id));
      toast({ title: "Subscription Deleted", description: `Plan "${planToDelete.name}" has been removed.` });
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      let description = "Could not delete plan.";
      if (error.message) {
        description += ` Message: ${error.message}`;
      }
      if (error.code) { // Log Firebase specific error code
        description += ` Firebase Code: ${error.code}`;
        console.error("Firebase error details:", error);
      }
      toast({ variant: "destructive", title: "Delete Failed", description });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleFormSubmit = async (formData: Omit<SubscriptionPlan, 'id'>, originalPlanId?: string) => {
    setIsLoading(true);
    try {
      // Check for duplicate slug
      const slugQuery = query(collection(db, "subscriptions"), where("slug", "==", formData.slug));
      const slugSnapshot = await getDocs(slugQuery);
      if (!slugSnapshot.empty) {
        if (originalPlanId && slugSnapshot.docs[0].id === originalPlanId) {
          // Editing the same plan, slug hasn't changed to conflict with another
        } else {
          toast({ variant: "destructive", title: "Duplicate Slug", description: "A subscription with this slug already exists." });
          setIsLoading(false);
          throw new Error("Duplicate slug");
        }
      }

      if (originalPlanId) {
        const planDocRef = doc(db, "subscriptions", originalPlanId);
        await updateDoc(planDocRef, formData);
        toast({ title: "Subscription Updated", description: `Subscription "${formData.name}" has been successfully updated.` });
      } else {
        await addDoc(collection(db, "subscriptions"), formData);
        toast({ title: "Subscription Created", description: `Subscription "${formData.name}" has been successfully added.` });
      }
      await loadPlans();
    } catch (error: any) {
      console.error("Error submitting subscription form:", error);
      if (error.message !== "Duplicate slug") { // Avoid double toast for duplicate slug
        let description = "Could not save subscription.";
        if (error.message) {
          description += ` Message: ${error.message}`;
        }
        if (error.code) { // Log Firebase specific error code
          description += ` Firebase Code: ${error.code}`;
          console.error("Firebase error details:", error);
        }
        toast({ variant: "destructive", title: "Submission Failed", description });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const columns = defineSubscriptionColumns({
    onEdit: handleEditPlan,
    onDelete: handleDeletePlanAttempt,
  });

  if (isLoading && plans.length === 0) {
    return (
      <div className="container mx-auto py-2 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Package className="w-8 h-8 mr-3 text-primary" /> Subscription Management
        </h1>
        <Button onClick={handleAddPlanClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Subscription
        </Button>
      </div>
       <p className="text-muted-foreground mb-6">
        Define and manage subscription plans available in Ozarnia Hub.
      </p>
      <SubscriptionsDataTable columns={columns} data={plans} />
      <SubscriptionFormDialog
        plan={selectedPlan}
        onFormSubmit={handleFormSubmit}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the subscription "{planToDelete?.name}".
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPlanToDelete(null); setIsLoading(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

