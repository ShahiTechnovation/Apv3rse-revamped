import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Globe,
  BookOpen,
  Code2,
} from "lucide-react";
import { FooterBackgroundGradient } from "~/components/ui/hover-footer";
import { TextHoverEffect } from "~/components/ui/hover-footer";

function Footer() {
  // Footer link data
  const footerLinks = [
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "Quick Start", href: "/docs#quick-start" },
        { label: "API Reference", href: "/docs#api" },
        { label: "Examples", href: "https://github.com/ShahiTechnovation/Apv3rse-revamped" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "GitHub", href: "https://github.com/ShahiTechnovation/Apv3rse-revamped" },
        { label: "Discord", href: "#" },
        { label: "Twitter", href: "https://x.com/APV3RSE" },
        {
          label: "Support",
          href: "#",
          pulse: true,
        },
      ],
    },
  ];

  // Contact info data
  const contactInfo = [
    {
      icon: <Mail size={18} className="text-[#00D4AA]" />,
      text: "hello@apv3rse.xyz",
      href: "mailto:hello@apv3rse.xyz",
    },
    {
      icon: <Globe size={18} className="text-[#00D4AA]" />,
      text: "apv3rse.xyz",
      href: "https://apv3rse.xyz",
    },
    {
      icon: <MapPin size={18} className="text-[#00D4AA]" />,
      text: "Built with ❤️ for Aptos",
    },
  ];

  // Social media icons
  const socialLinks = [
    { icon: <Github size={20} />, label: "GitHub", href: "https://github.com/ShahiTechnovation/Apv3rse-revamped" },
    { icon: <Twitter size={20} />, label: "Twitter", href: "#" },
    { icon: <BookOpen size={20} />, label: "Docs", href: "/docs" },
    { icon: <Code2 size={20} />, label: "Aptos", href: "https://aptos.dev" },
    { icon: <Globe size={20} />, label: "Website", href: "/" },
  ];

  return (
    <footer className="bg-[#0F0F11]/90 backdrop-blur-lg relative h-fit rounded-3xl overflow-hidden m-8 border border-bolt-elements-borderColor">
      <div className="max-w-7xl mx-auto p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <svg width="32" height="32" viewBox="0 0 233 233" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M85.6289 24L37 140.47H85.6289L134.258 24H85.6289Z" fill="#00D4AA"/>
                <path d="M134.258 24L109.944 85.235L134.258 146.47L158.572 85.235L134.258 24Z" fill="#00D4AA"/>
                <path d="M37 146.47H85.6289L109.944 207.705H61.3145L37 146.47Z" fill="#00D4AA"/>
                <path d="M134.258 146.47H182.887L158.572 207.705H109.944L134.258 146.47Z" fill="#00D4AA"/>
              </svg>
              <span className="text-white text-3xl font-bold">Apv3rse</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              AI-powered development platform for building, deploying, and managing Aptos Move smart contracts.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-lg font-semibold mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-[#00D4AA] transition-colors"
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {link.label}
                    </a>
                    {link.pulse && (
                      <span className="absolute top-0 right-[-10px] w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-[#00D4AA] transition-colors text-sm"
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-gray-400 hover:text-[#00D4AA] transition-colors text-sm">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-gray-700 my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0">
          {/* Social icons */}
          <div className="flex space-x-6 text-gray-400">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-[#00D4AA] transition-colors"
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center md:text-left text-gray-400">
            &copy; {new Date().getFullYear()} Apv3rse. Built for Aptos Ecosystem.
          </p>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-[30rem] -mt-52 -mb-36">
        <TextHoverEffect text="APV3RSE" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default Footer;
