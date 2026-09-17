import type { ComponentType } from "react";
import {
  Shield,
  BookOpen,
  FileText,
  Users,
  Handshake,
  HelpCircle,
  Building2,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Phone,
} from "lucide-react";

// Shared About dropdown / mobile menu link list (nav.about.* keys).
export type NavItem = {
  href: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
};

export const ABOUT_LINKS: NavItem[] = [
  { href: "/about/mission", labelKey: "nav.about.mission", icon: Shield },
  { href: "/about/process", labelKey: "nav.about.process", icon: BookOpen },
  { href: "/about/story", labelKey: "nav.about.story", icon: FileText },
  { href: "/about/team", labelKey: "nav.about.team", icon: Users },
  { href: "/about/partners", labelKey: "nav.about.partners", icon: Handshake },
  { href: "/about/faq", labelKey: "nav.about.faq", icon: HelpCircle },
  { href: "/about/about-us", labelKey: "nav.about.about_us", icon: Building2 },
  { href: "/about/privacy", labelKey: "nav.about.privacy", icon: ShieldCheck },
  { href: "/about/terms", labelKey: "nav.about.terms", icon: Scale },
  { href: "/about/careers", labelKey: "nav.about.careers", icon: HeartHandshake },
  { href: "/about/legal", labelKey: "nav.about.legal", icon: FileText },
  { href: "/about/contact", labelKey: "nav.about.contact", icon: Phone },
];
