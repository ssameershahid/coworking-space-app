import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password Reset",
      description: "If an account with this email exists, you will receive password reset instructions.",
    });
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <span className="text-3xl font-bold text-gray-800">CalmKaaj</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-600 text-sm">Enter your email to receive reset instructions</p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-sm font-medium rounded-lg"
            >
              Send Reset Instructions
            </Button>
          </form>

          {/* Back to Sign In */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <img src="/logo-main.png" alt="CalmKaaj" className="h-12 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome to CalmKaaj</h1>
          <p className="text-gray-600 text-sm">Sign in to access your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10 w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-sm font-medium rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}