drop table orderpizzatopping;
drop table orderpizzas;
drop table orders;
drop table pizzas;
drop table toppings;
drop table customers;
drop table deliveryman;
drop table branches;
drop table ordertype;

CREATE TABLE "customers" (
    "customerid" serial  ,
    "firstname" varchar(50)   ,
    "lastname" varchar(50)   ,
    "customeremail" varchar(100)   ,
    "customerphone" varchar(20)   ,
    "branchid" int   ,
    "customerpassword" varchar(300),
    CONSTRAINT "pk_customers" PRIMARY KEY (
        "customerid"
     )
);

CREATE TABLE "branches" (
    "branchid" serial primary key,
    "branchname" varchar(20)
);

CREATE TABLE "orders" (
    "orderid" int   ,
    "customerid" int   ,
    "deliverymanid" int   ,
    "typeid" int   ,
    "total" double precision  ,
    "datetime" timestamp  ,
    "address" varchar(100) ,
    CONSTRAINT "pk_orders" PRIMARY KEY (
        "orderid"
     )
);


CREATE TABLE "deliveryman" (
    "deliverymanid" int   ,
    -- orderid int fk >- orders.orderid
    "typeid" int   ,
    "name" varchar(20)   ,
    "branchid" int   ,
    "avaiability" int  ,
    CONSTRAINT "pk_deliveryman" PRIMARY KEY (
        "deliverymanid"
     )
);

CREATE TABLE "ordertype" (
    "typeid" int   ,
    "type" varchar(20)   ,
    CONSTRAINT "pk_ordertype" PRIMARY KEY (
        "typeid"
     )
);

CREATE TABLE "orderpizzas" (
    "orderid" int   ,
    "pizzaid" int   ,
    "quantity" int   ,
    "userrating" double precision  ,
    "comment" varchar(80)
);

CREATE TABLE "pizzas" (
    "pizzaid" int   ,
    "pizzaname" varchar(20)   ,
    "details" varchar(100)   ,
    "price" double precision  ,
    "rating" double precision  ,
    CONSTRAINT "pk_pizzas" PRIMARY KEY (
        "pizzaid"
     )
);

CREATE TABLE "toppings" (
    "toppingid" int   ,
    "toppingname" varchar(20)   ,
    "details" varchar(200)   ,
    "price" double precision  ,
    CONSTRAINT "pk_toppings" PRIMARY KEY (
        "toppingid"
     )
);

CREATE TABLE "orderpizzatopping" (
    "orderid" int   ,
    "pizzaid" int   ,
    "toppingid" int
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

ALTER TABLE "orderpizzatopping" ADD CONSTRAINT "fk_orderpizzatopping_orderid" FOREIGN KEY("orderid")
REFERENCES "orders" ("orderid");

ALTER TABLE "orderpizzatopping" ADD CONSTRAINT "fk_orderpizzatopping_pizzaid" FOREIGN KEY("pizzaid")
REFERENCES "pizzas" ("pizzaid");

ALTER TABLE "orderpizzatopping" ADD CONSTRAINT "fk_orderpizzatopping_toppingid" FOREIGN KEY("toppingid")
REFERENCES "toppings" ("toppingid");

INSERT INTO branches (branchname)
                        VALUES ('dhaka');


