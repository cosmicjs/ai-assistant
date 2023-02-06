import * as React from "react"
import Link from "next/link"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div>
      <Icons.logo className="mr-2 inline-block h-6 w-6" />
      <span className="inline-block font-bold">
        {siteConfig.name}
      </span>
    </div>
  )
}
