const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      console.log("get with email: ", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.getUserWithEmail = getUserWithEmail;

// getUserWithEmail("juliansantos@aol.com"); // test: should equal 'Neil Medina'

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      console.log("get with ID: ", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};

exports.getUserWithId = getUserWithId;

// getUserWithId(7); // test: should equal 'Dale Coleman'

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = (user) => {
  return pool
    .query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,
      [user.name, user.email, user.password]
    )
    .then((result) => {
      console.log("create new user with ID: ", result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.addUser = addUser;

// addUser({
//   name: 'Jarrod Heinbecker',
//   email: 'jarrod@sth.com',
//   password: 'password777777777777',
// }); // test: should return new user object

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  let query =
    "SELECT reservations.*, properties.title, properties.cost_per_night, avg(property_reviews.rating) as average_rating \
            FROM properties JOIN reservations ON properties.id = reservations.property_id \
            JOIN property_reviews ON properties.id = property_reviews.property_id \
            WHERE reservations.guest_id = $1 \
            GROUP BY reservations.id, properties.title, properties.cost_per_night \
            ORDER BY reservations.start_date \
            LIMIT $2;";

  return pool
    .query(query, [guest_id, limit])
    .then((result) => {
      console.log(
        `listing reservations for guest ID ${guest_id}: `,
        result.rows
      );
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];

  let queryString =
    "SELECT properties.*, avg(property_reviews.rating) as average_rating \
  FROM properties \
  JOIN property_reviews ON properties.id = property_id ";

  if (options === {}) {
    queryParams.push(limit);
    queryString += `ORDER BY cost_per_night LIMIT $${queryParams.length};`;
  } else {
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
    }

    if (options.owner_id) {
      queryParams.push(options.owner_id);
      queryString += `AND properties.owner_id = $${queryParams.length} `;
    }

    if (options.minimum_price_per_night) {
      queryParams.push(options.minimum_price_per_night * 100);
      queryString += `AND properties.cost_per_night >= $${queryParams.length} `;
    }

    if (options.maximum_price_per_night) {
      queryParams.push(options.maximum_price_per_night * 100);
      queryString += `AND properties.cost_per_night <= $${queryParams.length} `;
    }

    queryString += `GROUP BY properties.id `;

    if (options.minimum_rating) {
      queryParams.push(options.minimum_rating);
      queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
    }
    queryParams.push(limit);
    queryString += `ORDER BY cost_per_night LIMIT $${queryParams.length};`;
  }

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log("Filtered list of properties: ", result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;

getAllProperties({  // if options are given
  city: "Vancouver",
  owner_id: 346,
  minimum_price_per_night: 300,
  maximum_price_per_night: 350,
  minimum_rating: 3.5,
});

getAllProperties({},3);  // if no options are given

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
