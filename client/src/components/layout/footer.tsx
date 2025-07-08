import { Instagram, Twitter, Facebook, MapPin, Phone, Mail, Linkedin } from "lucide-react";
import { SiSpotify } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Mobile-first compact design */}
        <div className="space-y-6 md:space-y-0">
          {/* Brand and Social */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full md:w-auto">
              <div className="flex items-center space-x-4">
                <img src="/logo-main.png" alt="CalmKaaj" className="h-6 w-auto" />
                <p className="text-xs text-gray-600 hidden sm:block">
                  Your ideal workspace solution
                </p>
              </div>
              <div className="flex space-x-3 mt-2 sm:mt-0">
                <a href="https://www.instagram.com/calm_kaaj/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://www.facebook.com/calmkaaj.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://www.linkedin.com/company/calmkaajorg/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://open.spotify.com/user/31db4uqj6bkwonltubo7e5j7bsk4?si=dwgmoGs4SVGyyXNZKv7rDA" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <SiSpotify className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Compact 2-column grid for mobile, 4-column for desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm">
            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Quick Actions</h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li><a href="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</a></li>
                <li><a href="/cafe" className="hover:text-orange-500 transition-colors">Cafe Ordering</a></li>
                <li><a href="/rooms" className="hover:text-orange-500 transition-colors">Meeting Rooms</a></li>
                <li><a href="/community" className="hover:text-orange-500 transition-colors">Community</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Company</h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li><a href="https://www.calmkaaj.org/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Home</a></li>
                <li><a href="https://www.calmkaaj.org/our-services/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Services</a></li>
                <li><a href="https://www.calmkaaj.org/about-us/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">About</a></li>
                <li><a href="https://www.calmkaaj.org/contact/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Locations */}
            <div className="col-span-2 md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Locations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <a href="https://www.calmkaaj.org/calmkaaj-blue-area/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                    Blue Area, Islamabad
                  </a>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <a href="https://www.calmkaaj.org/calmkaaj-i-10/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                    I-10/3, Islamabad
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section - always visible */}
          <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-2 sm:space-y-0">
            <p>© 2025 CalmKaaj. All rights reserved.</p>
            <p>App developed with 🧡 by Arteryal</p>
          </div>
        </div>
      </div>
    </footer>
  );
}