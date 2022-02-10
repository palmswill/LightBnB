const properties = require("./json/properties.json");
const users = require("./json/users.json");

// pg connect

const { Pool } = require("pg");
const { _pools } = require("pg/lib");

const pool = new Pool({
  user: "labber",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

pool.connect(() => console.log("connected"));

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * from users WHERE email = $1;`, [email])
    .then((result) => {
      return result.rows[0] ? result.rows[0] : null;
    })
    .catch((err) => console.log(err));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * from users WHERE id = $1 ;`, [id])
    .then((result) => {
      return result.rows[0] ? result.rows[0] : null;
    })
    .catch((err) => console.log(err));
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(
      `INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *; `,
      [user.name, user.email, user.password]
    )
    .then((result) => result.rows[0])
    .catch((err) => console.log(err));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `SELECT * FROM reservations 
      JOIN properties ON properties.id= property_id 
      WHERE guest_id= $1 AND start_date > now()::date
      LIMIT $2;`,
      [guest_id, limit]
    )
    .then((result) => {
      return result.rows;
    })
    .catch((err) => console.log(err));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 2) => {
  let queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  // CHANGE to AND if there is already a query param
  let clause = "WHERE";
  // city
  if (options.city) {
    queryParams.push(`${options.city}`);
    queryString += `${clause} city LIKE  $${queryParams.length}`;
  }

  // owner_id
  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    if (queryParams.length > 1) {
      clause = "AND";
    }
    queryString += `${clause} owner_id = $${queryParams.length}`;
  }

  // minimum_price_per_night
  if (options.minimum_price_per_night) {
    if (options.minimum_price_per_night) {
      queryParams.push(Number(options.minimum_price_per_night) * 100);
      if (queryParams.length > 1) {
        clause = "AND";
      }
      queryString += `${clause} cost_per_night >= $${queryParams.length}`;
    }
  }

  // maximum_price_per_night
  if (options.maximum_price_per_night) {
    if (options.maximum_price_per_night) {
      queryParams.push(Number(options.maximum_price_per_night) * 100);
      if (queryParams.length > 1) {
        clause = "AND";
      }
      queryString += `${clause} cost_per_night <= $${queryParams.length}`;
    }
  }
  // limit query
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length + 2}`;

  // minimum_rating
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    if (queryParams.length > 1) {
      clause = "AND";
    }
    queryString = ` SELECT * FROM (${queryString}) as result WHERE average_rating >= $${queryParams.length};`;
  }

  // limit
  queryParams.push(limit);

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  let column = [];
  let value = [];
  let columnString = "";
  let valueString = "";
  Object.keys(property).forEach((key) => {
    if (property[key]) {
      column.push(key);
      value.push(property[key]);
    }
  });
  let params = column.concat(value);
  for (let index of params) {
    let heading = ",";
    if (index === 0 || index === params.length / 2) {
      heading = "";
    }
    if (index < params.length / 2) {
      columnString += heading + `$${index+1}`;
    } else {
      valueString += heading + `$${index+1}`;
    }
  }

  return pool
    .query(
      `INSERT INTO properties (${columnsString}) VALUES (${valueString}) RETURNING *;`,
      params
    )
    .then((result) => result.rows[0])
    .catch((err) => console.log(err));
};
exports.addProperty = addProperty;
