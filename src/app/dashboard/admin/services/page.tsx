import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminServicesPage() {
  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Settings className="w-8 h-8 mr-3 text-primary" /> Service Configuration
        </h1>
        {/* Add Button for "New Service" can be placed here if dynamic */}
      </div>
      <p className="text-muted-foreground mb-6">
        View and manage the configuration of available services in Ozarnia Hub.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Services Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Service configuration interface will be implemented here. This may include settings for each service, API endpoints, or feature flags.
          </p>
          {/* Placeholder for Services List/Table */}
           <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
            <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">Service Configuration Coming Soon</p>
            <p className="text-sm text-muted-foreground">Details and settings for services will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
