import { Instagram, Twitter, Facebook, MapPin, Phone, Mail, Linkedin } from "lucide-react";
import { SiSpotify } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const { user } = useAuth();
  
  // Show room booking for all users except cafe managers
  const showRoomBooking = user && user.role !== 'cafe_manager';
  return (
    <footer className="bg-gray-100 border-t border-gray-200 w-full">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        {/* Mobile Layout - Compact and Centered */}
      <div className="md:hidden">
          {/* Brand Section - Centered */}
          <div className="space-y-3 text-center flex flex-col items-center">
            <div className="flex items-center justify-center">
              <img src="/logo-main.png" alt="CalmKaaj" className="h-7 w-auto" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
              Your ideal workspace solution combining productivity, comfort, and a vibrant community environment.
            </p>
            <div className="flex space-x-4 justify-center">
              <a href="https://www.instagram.com/calm_kaaj/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/calmkaaj.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/calmkaajorg/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://open.spotify.com/user/31db4uqj6bkwonltubo7e5j7bsk4?si=dwgmoGs4SVGyyXNZKv7rDA" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <SiSpotify className="h-5 w-5" />
              </a>
            </div>
          </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src="/logo-main.png" alt="CalmKaaj" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your ideal workspace solution combining productivity, comfort, and a vibrant community environment.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/calm_kaaj/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/calmkaaj.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/calmkaajorg/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://open.spotify.com/user/31db4uqj6bkwonltubo7e5j7bsk4?si=dwgmoGs4SVGyyXNZKv7rDA" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors">
                <SiSpotify className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</a>
              </li>
              <li>
                <a href="/cafe" className="hover:text-orange-500 transition-colors">Cafe Ordering</a>
              </li>
              {showRoomBooking && (
                <li>
                  <a href="/rooms" className="hover:text-orange-500 transition-colors">
                    Meeting Rooms
                  </a>
                </li>
              )}
              <li>
                <a href="/community" className="hover:text-orange-500 transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href="https://www.calmkaaj.org/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Home</a>
              </li>
              <li>
                <a href="https://www.calmkaaj.org/our-services/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Services</a>
              </li>
              <li>
                <a href="https://www.calmkaaj.org/about-us/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">About</a>
              </li>
              <li>
                <a href="https://www.calmkaaj.org/contact/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Contact</a>
              </li>
            </ul>
          </div>

          {/* Locations Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Locations</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <a href="https://www.calmkaaj.org/calmkaaj-blue-area/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                    Blue Area, Islamabad
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <a href="https://www.calmkaaj.org/calmkaaj-i-10/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                    I-10/3, Islamabad
                  </a>
                </div>
              </div>
            </div>
          </div>
      </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-4 pt-4 pb-6 md:mt-8 md:pt-6 md:pb-0 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 space-y-2 md:space-y-0">
          <p>© 2025 CalmKaaj. All rights reserved.</p>
          <p>App developed with 🧡 by Artyreal</p>
        </div>
      </div>
    </footer>
  );
}