import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu } from "lucide-react";

export default function MenuManagement() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-6 w-6" />
            Menu Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Menu Management page is working!</p>
        </CardContent>
      </Card>
    </div>
  );
}