SELECT city , count(reservations.*) as total_reservation FROM
reservations
JOIN properties ON properties.id=property_id
GROUP BY city
ORDER BY total_reservation DESC ;