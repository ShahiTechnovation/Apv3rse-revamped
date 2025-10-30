import Footer from '~/components/footer/Footer';

export default function TestFooter() {
  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-bolt-elements-textPrimary mb-8">
          Footer Test Page
        </h1>
        <p className="text-bolt-elements-textSecondary mb-8">
          This page is to test if the footer component is rendering correctly.
          Scroll down to see the footer.
        </p>
        
        <div className="h-[50vh] bg-bolt-elements-background-depth-2 rounded-lg flex items-center justify-center mb-8">
          <p className="text-bolt-elements-textSecondary">Content Area</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
