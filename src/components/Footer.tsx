const Footer = () => {
  return (
    <footer className="bg-fk-footer text-white/75 py-10 mt-auto border-t border-white/5">
      <div className="max-w-[1300px] mx-auto px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        <div>
          <h4 className="text-white/45 text-xs uppercase tracking-wider mb-4 font-medium">About</h4>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Contact Us
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            About Us
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Careers
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Flipkart Stories
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Press
          </a>
        </div>
        <div>
          <h4 className="text-white/45 text-xs uppercase tracking-wider mb-4 font-medium">Help</h4>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Payments
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Shipping
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Cancellation & Returns
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            FAQ
          </a>
        </div>
        <div>
          <h4 className="text-white/45 text-xs uppercase tracking-wider mb-4 font-medium">Policy</h4>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Return Policy
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Terms Of Use
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Security
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Sitemap
          </a>
        </div>
        <div>
          <h4 className="text-white/45 text-xs uppercase tracking-wider mb-4 font-medium">Social</h4>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Facebook
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            YouTube
          </a>
          <a href="#" className="block text-sm mb-2.5 hover:text-white transition-colors">
            Instagram
          </a>
        </div>
        <div>
          <h4 className="text-white/45 text-xs uppercase tracking-wider mb-4 font-medium">Registered Office</h4>
          <p className="text-xs leading-relaxed">
            Flipkart Internet Private Limited,
            <br />
            Buildings Alyssa, Begonia &
            <br />
            Clove Embassy Tech Village,
            <br />
            Outer Ring Road, Devarabeesanahalli,
            <br />
            Bengaluru, Karnataka – 560103
          </p>
        </div>
      </div>
      <div className="max-w-[1300px] mx-auto px-4 pt-6 mt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <span>© 2026 Flipkart Clone — for learning purposes</span>
        <span className="text-white/40">Built with care for Scaler SDE Internship</span>
      </div>
    </footer>
  );
};

export default Footer;
