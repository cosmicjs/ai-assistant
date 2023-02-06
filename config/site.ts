interface SiteConfig {
  name: string
  description: string
  links: {
    twitter: string
    github: string
    docs: string
  }
}

export const siteConfig: SiteConfig = {
  name: "Cosmic AI Writing Assistant",
  description:
    "An AI writing assistant",
  links: {
    twitter: "https://twitter.com/cosmicjs",
    github: "https://github.com/cosmicjs",
    docs: "https://docs.cosmicjs.com",
  },
}
