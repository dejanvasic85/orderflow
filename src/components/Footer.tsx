import { company } from "#/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 pb-8 pt-6 text-muted-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-2 text-center">
        <p className="m-0 text-sm">
          &copy; {year} {company.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
