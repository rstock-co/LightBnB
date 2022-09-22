SELECT  reservations.*, 
        properties.title, 
        properties.cost_per_night, 
        avg(property_reviews.rating) as average_rating
FROM properties
JOIN reservations ON properties.id = reservations.property_id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = '1'
GROUP BY reservations.id, properties.title, properties.cost_per_night
ORDER BY reservations.start_date
LIMIT 10;