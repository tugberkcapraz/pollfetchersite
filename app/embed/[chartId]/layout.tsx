export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-transparent w-full h-full">
      {children}
    </div>
  )
} 