import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { NewWordForm } from "@/components/contribute/new-word-form";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Suggest a New Word — Manipuri Dictionary",
  description: "Suggest a new word for the Manipuri Dictionary.",
};

export default async function NewWordPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/contribute/new");
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <nav className="text-sm text-muted-2 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/contribute" className="hover:text-foreground">Contribute</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">New word</span>
          </nav>

          <h1 className="text-2xl font-bold mb-2">Suggest a new word</h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details below. Your suggestion will be reviewed before
            it appears in the dictionary.
          </p>

          <NewWordForm />
        </div>
      </main>
    </>
  );
}