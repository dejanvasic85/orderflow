import { createFileRoute, Link } from "@tanstack/react-router";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/config";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <section className="flex max-w-2xl flex-col items-center text-center">
          <h1 className="mb-6 leading-tight text-foreground">{company.name}</h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A fresh start.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
