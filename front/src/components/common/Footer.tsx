import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, BoolOpen, Users } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7x1 mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center text-2x1 font-bold">
              <Palette className="mr-2 text-indigo-400" />
              <span>ArtCourse</span>
            </Link>
            <p className="text-gray-300 text-sm">
              Discover your creative potential with our free platform.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="font-semibold text-lg md-4">Explore</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/courses/" className="text-gray-300 hover:text-indigo-400 transition">
                All Courses
              </Link>
            </li>
          </ul>
        </div>

        {/* Information */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Information</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="text-gray-300 hover:text-indigo-400 transition">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-gray-300 hover:text-indigo-400 transition">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/faq" className="text-gray-300 hover:text-indigo-400 transition">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-gray-300 hover:text-indigo-400 transition">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
        {/* Newsletter */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Stay Updated</h3>
          <p className="text-gray-300 text-sm mb-4">Subscribe to our newsletter for the latest courses and articles</p>
          <form className="mt-2">
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 w-full text-gray-900 rounded-l focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-r text-white transition"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </footer>
  );
};

export default Footer;