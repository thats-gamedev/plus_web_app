import { NotFoundState } from "@/components/shared/not-found-state"

// notFound() on public pages (e.g. an unknown /lists/ slug) keeps the site
// header and footer.
export default function PublicNotFound() {
  return <NotFoundState />
}
