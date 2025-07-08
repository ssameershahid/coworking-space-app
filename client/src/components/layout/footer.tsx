import { Instagram, Twitter, Facebook, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src="/logo-main.png" alt="CalmKaaj" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your ideal workspace solution combining productivity, comfort, and a vibrant community environment.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href="/cafe" className="hover:text-orange-500 transition-colors">
                  Cafe
                </a>
              </li>
              <li>
                <a href="/rooms" className="hover:text-orange-500 transition-colors">
                  Meeting Rooms
                </a>
              </li>
              
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">
                  Coworking Space
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">Contact</a>
              </li>
            </ul>
          </div>

          {/* Hours & Location Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Hours & Location</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p>First Floor, Tower B</p>
                  <p>123 Business Park, Innovation District</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>+91 12345 67890</span>
              </div>
              
              
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2025 CalmKaaj. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}