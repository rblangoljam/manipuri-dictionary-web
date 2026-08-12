import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { EditWordForm } from "@/components/contribute/edit-word-form";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Suggest an Edit — Manipuri Dictionary",
  description: "Suggest a correction or improvement to a dictionary entry.",
};

export default async function EditWordPage({
  searchParams,
}: {
  searchParams: Promise<{ word?: string }>;
}) {
  const { word: slug = "" } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    const callback = slug
      ? `/contribute/edit?word=${encodeURIComponent(slug)}`
      : "/contribute";
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
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
            <span className="text-foreground font-medium">Edit word</span>
          </nav>

          <h1 className="text-2xl font-bold mb-2">Suggest an edit</h1>
          <p className="text-muted-foreground mb-8">
            Update the fields below with your correction. Your suggestion will
            be reviewed before it is applied.
          </p>

          {slug ? (
            <EditWordForm slug={slug} />
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No word specified. Find a word to edit first.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Search dictionary
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}