
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Link as LinkIcon, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <BookOpen className="h-7 w-7" />
            <span className="text-2xl font-headline font-bold">Ozarnia Hub API</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Go to Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16">
        <div className="container space-y-12">
          <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
              API Documentation
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Integrate your third-party services with Ozarnia Hub for seamless user authentication and access management.
            </p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-6 h-6 text-primary" />
                Authentication Endpoints
              </CardTitle>
              <CardDescription>
                Use these endpoints to allow users to register or log in to Ozarnia Hub from your service.
                The API will validate credentials and the provided service redirect URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Registration Endpoint */}
              <section>
                <h2 className="text-2xl font-semibold mb-2">User Registration</h2>
                <p className="mb-1"><code className="font-mono text-sm bg-muted p-1 rounded-md">POST /api/auth/external/register</code></p>
                <p className="text-muted-foreground mb-3">Registers a new user in Ozarnia Hub.</p>
                
                <h3 className="text-lg font-medium mb-1">Request Body (JSON)</h3>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "name": "string (required)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 6 characters)",
  "serviceRedirectUrl": "string (required, full URL of your service page)"
}`}
                </pre>
                <p className="text-xs text-muted-foreground mt-1">
                  The <code className="font-mono text-xs">serviceRedirectUrl</code> must match one of the active service URLs configured in Ozarnia Hub.
                </p>

                <h3 className="text-lg font-medium mt-4 mb-1">Responses</h3>
                <p className="text-muted-foreground mb-1">Success (200 OK):</p>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "User registered successfully. Please proceed with login.",
  "redirectTo": "string (validated serviceRedirectUrl or Ozarnia Hub URL)"
}`}
                </pre>
                <p className="text-muted-foreground mt-2 mb-1">Error (400, 401, 500):</p>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "success": false,
  "error": "Error message detailing the issue (e.g., Email already in use, Invalid service URL, Password too weak)",
  "redirectTo": "string (Ozarnia Hub URL as fallback)"
}`}
                </pre>
              </section>

              <hr className="my-6 border-border" />

              {/* Login Endpoint */}
              <section>
                <h2 className="text-2xl font-semibold mb-2">User Login</h2>
                <p className="mb-1"><code className="font-mono text-sm bg-muted p-1 rounded-md">POST /api/auth/external/login</code></p>
                <p className="text-muted-foreground mb-3">Logs in an existing user to Ozarnia Hub.</p>
                
                <h3 className="text-lg font-medium mb-1">Request Body (JSON)</h3>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "email": "string (required, valid email format)",
  "password": "string (required)",
  "serviceRedirectUrl": "string (required, full URL of your service page)"
}`}
                </pre>
                 <p className="text-xs text-muted-foreground mt-1">
                  The <code className="font-mono text-xs">serviceRedirectUrl</code> must match one of the active service URLs configured in Ozarnia Hub.
                </p>

                <h3 className="text-lg font-medium mt-4 mb-1">Responses</h3>
                <p className="text-muted-foreground mb-1">Success (200 OK):</p>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Login successful.",
  "redirectTo": "string (validated serviceRedirectUrl)"
}`}
                </pre>
                <p className="text-muted-foreground mt-2 mb-1">Error (400, 401, 500):</p>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
{`{
  "success": false,
  "error": "Error message detailing the issue (e.g., Invalid credentials, Invalid service URL)",
  "redirectTo": "string (Ozarnia Hub URL as fallback)"
}`}
                </pre>
              </section>

              <hr className="my-6 border-border" />

              <section>
                <h2 className="text-2xl font-semibold mb-2">Redirection Flow</h2>
                <p className="text-muted-foreground mb-3">
                  The API endpoints will not perform HTTP redirects themselves. Instead, they will return a JSON response containing a <code className="font-mono text-sm">redirectTo</code> field.
                  Your third-party service (the client application making the API call) is responsible for:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-4">
                  <li>Receiving the JSON response from the Ozarnia Hub API.</li>
                  <li>
                    If <code className="font-mono text-sm">success</code> is true, redirecting the user's browser to the URL provided in the <code className="font-mono text-sm">redirectTo</code> field. This will typically be your validated <code className="font-mono text-sm">serviceRedirectUrl</code>.
                  </li>
                  <li>
                    If <code className="font-mono text-sm">success</code> is false, displaying the error message to the user. You might also choose to redirect them to the Ozarnia Hub URL (provided in <code className="font-mono text-sm">redirectTo</code> as a fallback) or keep them on your service with an error message.
                  </li>
                </ol>
                <p className="text-muted-foreground mt-3">
                  The main Ozarnia Hub URL where users can manage their account is: <a href="https://hub.myozarniaung.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://hub.myozarniaung.com</a> (this may vary based on your deployment).
                </p>
              </section>

               <hr className="my-6 border-border" />

                <section>
                    <h2 className="text-2xl font-semibold mb-2">User Info Endpoint (Example)</h2>
                    <p className="mb-1"><code className="font-mono text-sm bg-muted p-1 rounded-md">GET /api/auth/user-info</code></p>
                    <p className="text-muted-foreground mb-3">
                        This is an example endpoint (currently a placeholder) that demonstrates how a service, once a user is authenticated with Ozarnia Hub (e.g., via OAuth2 or session cookies managed by the hub), could fetch basic user information.
                        Full implementation would require a secure token (e.g., JWT) to be passed in the <code className="font-mono text-sm">Authorization</code> header.
                    </p>
                    <p className="text-muted-foreground">
                        For now, this endpoint returns mock data. A production implementation would involve Firebase Admin SDK for token verification and data fetching.
                    </p>
                </section>
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
