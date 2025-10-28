-- Add cancelled_by field to track admin/team cancellations
ALTER TABLE meeting_bookings 
ADD COLUMN cancelled_by INTEGER REFERENCES users(id);

-- Add comment explaining the field
COMMENT ON COLUMN meeting_bookings.cancelled_by IS 'ID of the admin or team user who cancelled the booking (NULL if cancelled by booking owner)';

