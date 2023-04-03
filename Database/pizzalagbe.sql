-- Exported from QuickDBD: https://www.quickdatabasediagrams.com/
-- Link to schema: https://app.quickdatabasediagrams.com/#/d/bOjubE
-- NOTE! If you have used non-SQL datatypes in your design, you will have to change these here.


CREATE TABLE "customers" (
    "customerid" int   NOT NULL,
    "firstname" varchar(50)   NOT NULL,
    "lastname" varchar(50)   NOT NULL,
    "phone" varchar(20)   NOT NULL,
    "address" varchar(100)   NOT NULL,
    "branchid" int   NOT NULL,
    CONSTRAINT "pk_customers" PRIMARY KEY (
        "customerid"
     )
);

CREATE TABLE "orders" (
    "orderid" int   NOT NULL,
    "customerid" int   NOT NULL,
    "deliverymanid" int   NOT NULL,
    "typeid" int   NOT NULL,
    "total" double   NOT NULL,
    "datetime" datetime   NOT NULL,
    CONSTRAINT "pk_orders" PRIMARY KEY (
        "orderid"
     )
);

CREATE TABLE "branches" (
    "branchid" int   NOT NULL,
    "branchname" varchar(20)   NOT NULL,
    "district" varchar(20)   NOT NULL,
    CONSTRAINT "pk_branches" PRIMARY KEY (
        "branchid"
     )
);

CREATE TABLE "deliveryman" (
    "deliverymanid" int   NOT NULL,
    -- orderid int fk >- orders.orderid
    "typeid" int   NOT NULL,
    "name" varchar(20)   NOT NULL,
    "branchid" int   NOT NULL,
    "avaiability" tinyint   NOT NULL,
    CONSTRAINT "pk_deliveryman" PRIMARY KEY (
        "deliverymanid"
     )
);

CREATE TABLE "ordertype" (
    "typeid" int   NOT NULL,
    "type" varchar(20)   NOT NULL,
    CONSTRAINT "pk_ordertype" PRIMARY KEY (
        "typeid"
     )
);

CREATE TABLE "orderpizzas" (
    "orderid" int   NOT NULL,
    "pizzaid" int   NOT NULL,
    "quantity" int   NOT NULL,
    "userrating" double   NOT NULL,
    "comment" varchar(80)   NOT NULL
);

CREATE TABLE "pizzas" (
    "pizzaid" int   NOT NULL,
    "pizzaname" varchar(20)   NOT NULL,
    "details" varcahr(100)   NOT NULL,
    "price" double   NOT NULL,
    "rating" double   NOT NULL,
    CONSTRAINT "pk_pizzas" PRIMARY KEY (
        "pizzaid"
     )
);

CREATE TABLE "toppings" (
    "toppingid" int   NOT NULL,
    "toppingname" varchar(20)   NOT NULL,
    "details" varchar(200)   NOT NULL,
    "price" double   NOT NULL,
    CONSTRAINT "pk_toppings" PRIMARY KEY (
        "toppingid"
     )
);

CREATE TABLE "orderpizzatopping" (
    "orderid" int   NOT NULL,
    "pizzaid" int   NOT NULL,
    "toppingid" int   NOT NULL
);

ALTER TABLE "customers" ADD CONSTRAINT "fk_customers_branchid" FOREIGN KEY("branchid")
REFERENCES "branches" ("branchid");

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_customerid" FOREIGN KEY("customerid")
REFERENCES "customers" ("customerid");

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_deliverymanid" FOREIGN KEY("deliverymanid")
REFERENCES "deliveryman" ("deliverymanid");

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_typeid" FOREIGN KEY("typeid")
REFERENCES "ordertype" ("typeid");

ALTER TABLE "deliveryman" ADD CONSTRAINT "fk_deliveryman_typeid" FOREIGN KEY("typeid")
REFERENCES "ordertype" ("typeid");

ALTER TABLE "deliveryman" ADD CONSTRAINT "fk_deliveryman_branchid" FOREIGN KEY("branchid")
REFERENCES "branches" ("branchid");

ALTER TABLE "orderpizzas" ADD CONSTRAINT "fk_orderpizzas_orderid" FOREIGN KEY("orderid")
REFERENCES "orders" ("orderid");

ALTER TABLE "pizzas" ADD CONSTRAINT "fk_pizzas_pizzaid" FOREIGN KEY("pizzaid")
REFERENCES "orderpizzas" ("pizzaid");

ALTER TABLE "orderpizzatopping" ADD CONSTRAINT "fk_orderpizzatopping_orderid" FOREIGN KEY("orderid")
REFERENCES "orders" ("orderid");

ALTER TABLE "orderpizzatopping" ADD CONSTRAINT "fk_orderpizzatopping_pizzaid" FOREIGN KEY("pizzaid")
REFERENCES "pizzas" ("pizzaid");

ALTER TABLE "orderpizzatopping" ADD CONSTRAINT "fk_orderpizzatopping_toppingid" FOREIGN KEY("toppingid")
REFERENCES "toppings" ("toppingid");

