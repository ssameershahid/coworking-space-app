import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Announcement } from "@/lib/types";

interface AnnouncementsProps {
  announcements: Announcement[];
}

export default function Announcements({ announcements }: AnnouncementsProps) {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>([]);

  const activeAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  const dismissAnnouncement = (id: number) => {
    setDismissedAnnouncements(prev => [...prev, id]);
  };

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {activeAnnouncements.slice(0, 1).map((announcement) => (
        <Card key={announcement.id} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                <p className="text-blue-100 mb-4">{announcement.body}</p>
                {announcement.image_url && (
                  <img
                    src={announcement.image_url}
                    alt={announcement.title}
                    className="w-full max-w-sm rounded-lg mb-4"
                  />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  Learn More
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dismissAnnouncement(announcement.id)}
                className="text-white/60 hover:text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
