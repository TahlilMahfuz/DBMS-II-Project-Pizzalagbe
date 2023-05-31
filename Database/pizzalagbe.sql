DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS orderpizzatopping;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS pizzas;
DROP TABLE IF EXISTS toppings;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS deliveryman;
DROP TABLE IF EXISTS ordertype;
DROP TABLE IF EXISTS branches;

CREATE TABLE branches (
    branchid SERIAL PRIMARY KEY,
    branchname VARCHAR(20)
);
INSERT INTO branches (branchname)
                        VALUES ('Dhaka'); --1

create table admins(
    adminid serial primary key,
    branchid int,
    adminname varchar(100),
    adminemail varchar(100),
    adminphone varchar(100),
    adminpassword varchar(300),
    reg_date date not null default current_timestamp,
    foreign key (branchid) references branches(branchid)
);

CREATE TABLE ordertype (
    typeid serial PRIMARY KEY,
    type VARCHAR(20)
);

insert into ordertype (type)
        values ('Home Delivery'); --1
insert into ordertype (type)
        values ('Take Away'); --1


CREATE TABLE customers (
    customerid SERIAL PRIMARY KEY,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    customeremail VARCHAR(100),
    customerphone VARCHAR(20),
    customerpassword VARCHAR(300)
);

CREATE TABLE deliveryman (
    deliverymanid varchar(20) primary key,
    typeid INT,
    name VARCHAR(20),
    branchid INT,
    services INT default 0,
    password varchar(512) default '123',
    phone varchar(20),
    CONSTRAINT fk_deliveryman_typeid FOREIGN KEY (typeid)
        REFERENCES ordertype (typeid),
    CONSTRAINT fk_deliveryman_branchid FOREIGN KEY (branchid)
        REFERENCES branches (branchid)
);

CREATE TABLE orders (
    orderid SERIAL PRIMARY KEY,
    customerid INT,
    deliverymanid varchar(20),
    typeid INT,
    total DOUBLE PRECISION,
    datetime TIMESTAMP,
    address VARCHAR(100),
    branchid int,
    status smallint default 1,
    quantity INT,
    rating double precision,
    comment varchar(100),
    CONSTRAINT fk_orders_customerid FOREIGN KEY (customerid)
        REFERENCES customers (customerid),
    CONSTRAINT fk_orders_deliverymanid FOREIGN KEY (deliverymanid)
        REFERENCES deliveryman (deliverymanid),
        CONSTRAINT fk_orders_branches FOREIGN KEY (branchid)
        REFERENCES branches (branchid),
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
    CONSTRAINT pk_orderpizzatopping PRIMARY KEY (orderid, pizzaid, toppingid),
    CONSTRAINT fk_orderpizzatopping_orderid FOREIGN KEY (orderid)
        REFERENCES orders (orderid),
    CONSTRAINT fk_orderpizzatopping_pizzaid FOREIGN KEY (pizzaid)
        REFERENCES pizzas (pizzaid),
    CONSTRAINT fk_orderpizzatopping_toppingid FOREIGN KEY (toppingid)
        REFERENCES toppings (toppingid)
);

