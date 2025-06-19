
"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Wrench, Loader2, Settings2, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Service, SubscriptionPlan } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, getDoc, writeBatch } from "firebase/firestore";
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

const defaultServices: Omit<Service, 'slug'>[] = [
  {
    name: "Content Platform",
    description: "Access exclusive articles and content.",
    icon: "BookOpen",
    url: "content.myozarniaung.com",
    isActive: true,
    linkedSubscriptionIds: [],
  },
  {
    name: "URL Shortener",
    description: "Create and manage short links.",
    icon: "Link",
    url: "shortener.myozarniaung.com",
    isActive: true,
    linkedSubscriptionIds: [],
  },
  {
    name: "Randomizer Tool",
    description: "Generate random data and selections.",
    icon: "Shuffle",
    url: "randomizer.myozarniaung.com",
    isActive: true,
    linkedSubscriptionIds: [],
  },
  {
    name: "File Storage",
    description: "Securely store and share your files.",
    icon: "FileText",
    url: "file.myozarniaung.com",
    isActive: true,
    linkedSubscriptionIds: [],
  },
];

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
  const [isSeedingServices, setIsSeedingServices] = useState(false);
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
      if (error.message) description += ` Message: ${error.message}`;
      if (error.code) description += ` Firebase Code: ${error.code}`;
      toast({ variant: "destructive", title: "Error Loading Data", description });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeedDefaultServices = async () => {
    setIsSeedingServices(true);
    try {
        const batch = writeBatch(db);
        const servicesCol = collection(db, "services");
        let servicesAddedCount = 0;

        for (const defaultService of defaultServices) {
            const slug = defaultService.name.toLowerCase().replace(/\s+/g, '-');
            const serviceDocRef = doc(servicesCol, slug);
            const serviceDocSnap = await getDoc(serviceDocRef);

            if (!serviceDocSnap.exists()) {
                batch.set(serviceDocRef, { ...defaultService, slug }); // Add slug here as it's part of the defaultServices structure now.
                servicesAddedCount++;
            }
        }

        if (servicesAddedCount > 0) {
            await batch.commit();
            toast({ title: "Default Services Seeded", description: `${servicesAddedCount} new default service(s) have been added.` });
            await loadData(); // Refresh services list
        } else {
            toast({ title: "No New Services Seeded", description: "All default services already exist." });
        }
    } catch (error: any) {
        console.error("Error seeding default services:", error);
        toast({ variant: "destructive", title: "Seeding Failed", description: error.message || "Could not seed default services." });
    } finally {
        setIsSeedingServices(false);
    }
  };

  const handleAddServiceClick = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleDeleteServiceAttempt = async (service: Service) => {
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
      if (error.message) description += ` Message: ${error.message}`;
      if (error.code) description += ` Firebase Code: ${error.code}`;
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
        // When slug changes, we save the full serviceData (which includes isActive) under the newSlug as doc ID
        await setDoc(newDocRef, { ...serviceData, slug: newSlug });
        toast({ title: "Service Updated", description: `Service "${serviceData.name}" has been successfully updated (slug changed).` });
      } else if (originalSlug) {
        const serviceDocRef = doc(db, "services", originalSlug);
        // When slug doesn't change, we update serviceData (which includes isActive)
        await setDoc(serviceDocRef, { ...serviceData, slug: originalSlug }, { merge: true });
        toast({ title: "Service Updated", description: `Service "${serviceData.name}" has been successfully updated.` });
      } else {
        const serviceDocRef = doc(db, "services", newSlug);
        const serviceDocSnap = await getDoc(serviceDocRef);
        if(serviceDocSnap.exists()) {
            toast({ variant: "destructive", title: "Duplicate Slug", description: "A service with this slug already exists." });
            setIsLoading(false);
            throw new Error("Duplicate slug");
        }
        // For new service, save serviceData (including isActive) with newSlug as doc ID
        await setDoc(serviceDocRef, { ...serviceData, slug: newSlug });
        toast({ title: "Service Created", description: `Service "${serviceData.name}" has been successfully added.` });
      }
      await loadData();
    } catch (error: any) {
      console.error("Error submitting service form:", error);
       if (error.message !== "Duplicate slug") {
        let description = "Could not save service.";
        if (error.message) description += ` Message: ${error.message}`;
        if (error.code) description += ` Firebase Code: ${error.code}`;
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

  const allDefaultServicesExist = defaultServices.every(ds => 
    services.some(s => s.slug === ds.name.toLowerCase().replace(/\s+/g, '-'))
  );


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
        <div className="flex gap-2">
            {!allDefaultServicesExist && (
                 <Button onClick={handleSeedDefaultServices} variant="outline" disabled={isSeedingServices}>
                    {isSeedingServices ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                    Seed Default Services
                </Button>
            )}
            <Button onClick={handleAddServiceClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
            </Button>
        </div>
      </div>
      <p className="text-muted-foreground mb-6">
        Define and manage services available in Ozarnia Hub. Set service status to control visibility for users.
        Use the &quot;Seed Default Services&quot; button to populate common services if they don&apos;t exist.
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
