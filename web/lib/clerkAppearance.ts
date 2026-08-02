/** Shared Clerk theming so hosted auth UI matches EduVerify's brand tokens (see app/globals.css). */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0a2540",
    colorBackground: "#ffffff",
    colorText: "#0a1e35",
    colorTextSecondary: "#64748b",
    colorInputBackground: "#ffffff",
    colorInputText: "#0a1e35",
    colorDanger: "#dc2626",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-inter), Arial, Helvetica, sans-serif",
  },
  elements: {
    card: "shadow-none border border-border rounded-2xl",
    headerTitle: "font-display text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: "border border-border hover:bg-secondary",
    formButtonPrimary: "bg-accent text-accent-foreground hover:bg-accent/90 normal-case shadow-none",
    footerActionLink: "text-primary hover:text-accent",
    formFieldInput: "border-border focus:border-primary focus:ring-primary",
    identityPreviewEditButton: "text-primary",
  },
};
