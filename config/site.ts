import { NavItem } from "@/types/nav"

interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
    docs: string
  }
}

export const siteConfig: SiteConfig = {
  name: "Cosmic",
  description:
    "An AI writing assistant",
  mainNav: [],
  links: {
    twitter: "https://twitter.com/cosmicjs",
    github: "https://github.com/cosmicjs",
    docs: "https://docs.cosmicjs.com",
  },
}
