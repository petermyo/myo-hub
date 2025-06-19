
"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Wrench, Loader2, Settings2 } from "lucide-react"; // Using Settings2 for main icon
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Service, SubscriptionPlan } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { ServicesDataTable } from "@/components/dashboard/admin/services/services-data-table";
import { columns as defineServiceColumns } from "@/components/dashboard/admin/services/services-table-columns";
import { ServiceFormDialog } from "@/components/dashboard/admin/services/service-form-dialog";
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


async function fetchServicesFromFirestore(): Promise<Service[]> {
  const servicesCol = collection(db, "services");
  const serviceSnapshot = await getDocs(servicesCol);
  const serviceList = serviceSnapshot.docs.map(docSnap => ({ slug: docSnap.id, ...docSnap.data() } as Service));
  return serviceList;
}

async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const plansCol = collection(db, "subscriptions");
    const snapshot = await getDocs(plansCol);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SubscriptionPlan));
}


export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedServices, fetchedPlans] = await Promise.all([
        fetchServicesFromFirestore(),
        fetchSubscriptionPlans()
      ]);
      setServices(fetchedServices);
      setSubscriptionPlans(fetchedPlans);
    } catch (error: any) {
      console.error("Error fetching services or plans:", error);
      let description = "Could not fetch services or subscription plans.";
      if (error.message) {
        description += ` Message: ${error.message}`;
      }
      if (error.code) { // Log Firebase specific error code
        description += ` Firebase Code: ${error.code}`;
        console.error("Firebase error details:", error);
      }
      toast({ variant: "destructive", title: "Error Loading Data", description });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddServiceClick = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleDeleteServiceAttempt = async (service: Service) => {
    // TODO: Add check if service is in use (e.g., enabled by users, linked to active subscriptions that are used)
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete || !serviceToDelete.slug) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "services", serviceToDelete.slug));
      setServices(prevServices => prevServices.filter(s => s.slug !== serviceToDelete.slug));
      toast({ title: "Service Deleted", description: `Service "${serviceToDelete.name}" has been removed.` });
    } catch (error: any)      {
      console.error("Error deleting service:", error);
      let description = "Could not delete service.";
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
      setServiceToDelete(null);
    }
  };

  const handleFormSubmit = async (formData: Omit<Service, 'slug'> & { newSlug: string }, originalSlug?: string) => {
    setIsLoading(true);
    const { newSlug, ...serviceData } = formData;

    try {
      if (originalSlug && originalSlug !== newSlug) {
        const newDocRef = doc(db, "services", newSlug);
        const newDocSnap = await getDoc(newDocRef);

        if (newDocSnap.exists()) {
             toast({ variant: "destructive", title: "Duplicate Slug", description: "A service with the new slug already exists." });
             setIsLoading(false);
             throw new Error("Duplicate slug");
        }
        await deleteDoc(doc(db, "services", originalSlug));
        await setDoc(newDocRef, serviceData);
        toast({ title: "Service Updated", description: `Service "${serviceData.name}" has been successfully updated (slug changed).` });

      } else if (originalSlug) { // Editing existing service, slug is the same (newSlug === originalSlug)
        const serviceDocRef = doc(db, "services", originalSlug);
        await setDoc(serviceDocRef, serviceData, { merge: true });
        toast({ title: "Service Updated", description: `Service "${serviceData.name}" has been successfully updated.` });
      } else { // Adding new service
        const serviceDocRef = doc(db, "services", newSlug);
        const serviceDocSnap = await getDoc(serviceDocRef);

        if(serviceDocSnap.exists()) {
            toast({ variant: "destructive", title: "Duplicate Slug", description: "A service with this slug already exists." });
            setIsLoading(false);
            throw new Error("Duplicate slug");
        }
        await setDoc(serviceDocRef, serviceData);
        toast({ title: "Service Created", description: `Service "${serviceData.name}" has been successfully added.` });
      }
      await loadData();
    } catch (error: any) {
      console.error("Error submitting service form:", error);
       if (error.message !== "Duplicate slug") { // Avoid double toast for specific handled errors
        let description = "Could not save service.";
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

  const columns = defineServiceColumns({
    onEdit: handleEditService,
    onDelete: handleDeleteServiceAttempt,
  });

  if (isLoading && services.length === 0) {
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
          <Wrench className="w-8 h-8 mr-3 text-primary" /> Service Management
        </h1>
        <Button onClick={handleAddServiceClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">
        Define and manage services available in Ozarnia Hub.
      </p>
      <ServicesDataTable columns={columns} data={services} />
      {isFormOpen && (
        <ServiceFormDialog
            service={selectedService}
            onFormSubmit={handleFormSubmit}
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            availableSubscriptionPlans={subscriptionPlans}
        />
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the service "{serviceToDelete?.name}".
              This cannot be undone. Make sure no users or subscriptions depend on this service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setServiceToDelete(null); setIsLoading(false); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteService} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

