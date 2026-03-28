import "./globals.css";

export const metadata = {
  title: "IPL Predictor Pool",
  description: "A real-time IPL prediction pool for up to 8 players."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
