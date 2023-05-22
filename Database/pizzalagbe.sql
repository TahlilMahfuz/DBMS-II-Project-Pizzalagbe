DROP TABLE IF EXISTS admin;
create table admins(
    adminid serial primary key,
    adminname varchar(100),
    adminNID varchar(100),
    adminemail varchar(100),
    adminphone varchar(100),
    adminpassword varchar(300),
    reg_date date not null default current_timestamp
);

DROP TABLE IF EXISTS orderpizzatopping;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS pizzas;
DROP TABLE IF EXISTS toppings;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS deliveryman;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS ordertype;



CREATE TABLE branches (
    branchid SERIAL PRIMARY KEY,
    branchname VARCHAR(20)
);

CREATE TABLE customers (
    customerid SERIAL PRIMARY KEY,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    customeremail VARCHAR(100),
    customerphone VARCHAR(20),
    branchid INT,
    customerpassword VARCHAR(300),
    CONSTRAINT fk_customers_branchid FOREIGN KEY (branchid)
        REFERENCES branches (branchid)
);

CREATE TABLE ordertype (
    typeid serial PRIMARY KEY,
    type VARCHAR(20)
);

CREATE TABLE deliveryman (
    deliverymanid SERIAL PRIMARY KEY,
    typeid INT,
    name VARCHAR(20),
    branchid INT,
    avaiability INT default 1,
    CONSTRAINT fk_deliveryman_typeid FOREIGN KEY (typeid)
        REFERENCES ordertype (typeid),
    CONSTRAINT fk_deliveryman_branchid FOREIGN KEY (branchid)
        REFERENCES branches (branchid)
);

CREATE TABLE orders (
    orderid SERIAL PRIMARY KEY,
    customerid INT,
    deliverymanid INT,
    typeid INT,
    total DOUBLE PRECISION,
    datetime TIMESTAMP,
    address VARCHAR(100),
    CONSTRAINT fk_orders_customerid FOREIGN KEY (customerid)
        REFERENCES customers (customerid),
    CONSTRAINT fk_orders_deliverymanid FOREIGN KEY (deliverymanid)
        REFERENCES deliveryman (deliverymanid),
    CONSTRAINT fk_orders_typeid FOREIGN KEY (typeid)
        REFERENCES ordertype (typeid)
);

CREATE TABLE pizzas (
    pizzaid serial PRIMARY KEY,
    pizzaname VARCHAR(20),
    details VARCHAR(100),
    price DOUBLE PRECISION
);

CREATE TABLE toppings (
    toppingid serial PRIMARY KEY,
    toppingname VARCHAR(20),
    details VARCHAR(200),
    price DOUBLE PRECISION
);

CREATE TABLE orderpizzatopping (
    orderid INT,
    pizzaid INT,
    toppingid INT,
    CONSTRAINT fk_orderpizzatopping_orderid FOREIGN KEY (orderid)
        REFERENCES orders (orderid),
    CONSTRAINT fk_orderpizzatopping_pizzaid FOREIGN KEY (pizzaid)
        REFERENCES pizzas (pizzaid),
    CONSTRAINT fk_orderpizzatopping_toppingid FOREIGN KEY (toppingid)
        REFERENCES toppings (toppingid)
);






