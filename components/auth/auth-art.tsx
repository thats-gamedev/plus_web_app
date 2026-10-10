import Image from "next/image"

// The picture on the right of the auth pages. A free photo under the Unsplash
// License (commercial use allowed, no permission needed), loaded from
// Unsplash's image server as their guidelines ask. Credit is not required but
// given, as Unsplash asks for it, and so nobody mistakes it for our own render.
const ART = {
  src: "https://images.unsplash.com/photo-1715967142234-547de15379c7",
  alt: "",
  author: "Micke Lindström",
  profile: "https://unsplash.com/@misterlindstrom?utm_source=thats_gamedev_plus&utm_medium=referral",
  unsplash: "https://unsplash.com/?utm_source=thats_gamedev_plus&utm_medium=referral",
}

/** The picture, filling its parent (which must be `relative`), plus the credit. */
export function AuthArt() {
  return (
    <>
      <Image src={ART.src} alt={ART.alt} fill priority sizes="50vw" className="object-cover" />
      <p className="absolute right-6 bottom-6 rounded-full bg-ink/80 px-3 py-1.5 font-mono text-xs text-white/80 backdrop-blur">
        Photo by{" "}
        <a href={ART.profile} target="_blank" rel="noopener" className="underline hover:text-white">
          {ART.author}
        </a>{" "}
        on{" "}
        <a href={ART.unsplash} target="_blank" rel="noopener" className="underline hover:text-white">
          Unsplash
        </a>
      </p>
    </>
  )
}
