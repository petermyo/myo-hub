
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Terminal, Key, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-xl font-headline font-bold">Back to Docs</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Terminal className="h-7 w-7" />
            <span className="text-2xl font-headline font-bold">API Reference</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16">
        <div className="container space-y-12">
          <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
              Ozarnia Hub API
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Integrate your third-party services with Ozarnia Hub. This guide provides an overview of available endpoints, authentication methods, and usage examples.
            </p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-500" /> Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All API requests to Ozarnia Hub must be authenticated. We use token-based authentication.
                Your service will need to obtain a Firebase ID Token from a user logged into Ozarnia Hub and include it in the `Authorization` header of your API requests as a Bearer token.
              </p>
              <pre className="p-4 rounded-md bg-muted text-sm overflow-x-auto">
                <code>
                  {`Authorization: Bearer <FIREBASE_ID_TOKEN>`}
                </code>
              </pre>
              <p className="text-muted-foreground">
                The specifics of how your third-party service obtains this token will depend on its architecture (e.g., if it's a frontend app making requests on behalf of the user, or a backend service).
                Server-side validation of this token using the Firebase Admin SDK is highly recommended for backend integrations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-6 h-6 text-blue-500" /> Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Code className="w-5 h-5" /> GET /api/auth/user-info
                </h3>
                <p className="text-muted-foreground">
                  Retrieves basic information about the authenticated user.
                </p>
                <p className="font-medium">Request:</p>
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                  <li>Method: `GET`</li>
                  <li>Headers: `Authorization: Bearer <FIREBASE_ID_TOKEN>`</li>
                </ul>
                <p className="font-medium">Successful Response (200 OK):</p>
                <pre className="p-4 rounded-md bg-muted text-sm overflow-x-auto">
                  <code>
                    {`{\n  "uid": "string",\n  "email": "string",\n  "name": "string",\n  "role": "string",\n  "enabledServices": ["service-slug-1", "service-slug-2"]\n}`}
                  </code>
                </pre>
                 <p className="font-medium">Error Responses:</p>
                 <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                    <li>`401 Unauthorized`: If the token is missing, invalid, or expired.</li>
                    <li>`403 Forbidden`: If the user is authenticated but not authorized for a specific action (not typically applicable for this endpoint).</li>
                    <li>`500 Internal Server Error`: For unexpected server issues.</li>
                 </ul>
              </div>

              <div className="border-t pt-6 space-y-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Code className="w-5 h-5" /> More Endpoints (Coming Soon)
                </h3>
                <p className="text-muted-foreground">
                  Future endpoints may include:
                </p>
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                  <li>Checking if a user has access to a specific service.</li>
                  <li>Endpoints for service-specific actions (if applicable).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
           <Card className="mt-8">
            <CardHeader>
              <CardTitle>Important Notes & Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p><strong>Token Handling:</strong> Securely manage Firebase ID tokens. On the client-side, they refresh automatically. For backend use, ensure you validate them correctly using Firebase Admin SDK to check signature, expiration, and issuer.</p>
              <p><strong>Rate Limiting:</strong> (Conceptual) Be mindful of API rate limits. Excessive requests may be throttled.</p>
              <p><strong>Error Handling:</strong> Implement robust error handling in your application to manage different HTTP status codes returned by the API.</p>
              <p><strong>Data Privacy:</strong> Only request and use the minimum necessary user data for your service's functionality.</p>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-background">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ozarnia Hub by myozarniaung.com. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
