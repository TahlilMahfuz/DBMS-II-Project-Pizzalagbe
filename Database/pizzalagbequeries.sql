-- change delivery man id generator to make it unique
-- Queries
select * from branches;
select * from ordertype;
select * from deliveryman;
select * from branches where branchname='dhaka';
select * from customers;
select * from toppings;
select * from customers where customeremail=$1;
INSERT INTO customers (firstname,lastname,customeremail,customerphone,customerpassword,branchid)
                    VALUES ($1, $2, $3, $4, $5,$6)
                    RETURNING firstname,lastname,customeremail,customerphone,customerpassword,branchid;

-- post method queries
INSERT INTO branches (branchname)
                        VALUES ('dhaka'); --1

Insert into pizzas (pizzaname, details, price)
values ('Paperoni','Ami nijeo jani na ashole',1000) returning pizzaname,details,price;
--
Insert into toppings (toppingname, details, price)
        values ('cheese','Shadharon cheese dibe arki',50) returning toppingname,details,price;

--
insert into ordertype (type)
        values ('Take away'); --1

insert into ordertype (type)
        values ('Home delivery');--2

Insert into deliveryman (typeid,name,branchid,phone)
        values (1,'Mr. Tahlil',1,01782633834) returning deliverymanid,typeid,name,branchid,avaiability,phone;


select * from branches natural join ordertype;

select *
from orders natural join orderpizzatopping natural join customers natural join ordertype natural join branches natural join admins
where status=0 and branchid=1;

select * from orders natural join ordertype natural join customers where status=1 and typeid=1;


update orders set status=status-1, deliverymanid=null where orderid=1;

select *
from orders natural join ordertype natural join customers natural join branches
         where typeid=1 and branchid=1 and status=2;

select * from orders where status>2;







-- Funtions and procedures
/*************************************************/
-- generate delivery man id
CREATE OR REPLACE FUNCTION generate_deliveryman_id
    (deliveryman_name VARCHAR,phone_number VARCHAR,branch int,type int)
RETURNS VARCHAR AS $$
DECLARE
    id_prefix VARCHAR;
    id_suffix VARCHAR;
    id_branch VARCHAR;
    typeV varchar;
    branchV varchar;
    generated_id VARCHAR;
BEGIN
    id_prefix := LEFT(deliveryman_name, 3);
    RAISE NOTICE 'ID PREFIX: %', id_prefix;

    select branchname into id_branch
    from branches where branchid=branch;

    id_branch := LEFT(id_branch, 3);
    RAISE NOTICE 'ID Branch: %', id_branch;
    id_suffix := RIGHT(phone_number, 3);
    RAISE NOTICE 'ID SUFFIX: %', id_suffix;
    branchV:=cast(branch as varchar);
    typeV:=cast(type as varchar);
    generated_id := type ||'-'|| id_prefix ||'-'|| id_branch ||'-'|| id_suffix;
    RAISE NOTICE 'GENERATED ID: %', generated_id;
    RETURN generated_id;
END
$$ LANGUAGE plpgsql;

--Trigger to set the deliveryman id
CREATE OR REPLACE FUNCTION set_deliveryman_id()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.deliverymanid :=
        generate_deliveryman_id(NEW.name, NEW.phone,NEW.branchid,
            NEW.typeid);
    raise notice 'Set deliveryman %',new.deliverymanid;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- Execute trigger
CREATE or replace TRIGGER before_insert_deliveryman
    BEFORE INSERT ON deliveryman
    FOR EACH ROW
    EXECUTE FUNCTION set_deliveryman_id();


-- testing
DO
$$
DECLARE
  deliveryman_id deliveryman.deliverymanid%TYPE; -- Define a variable to store the deliveryman ID
BEGIN
  -- Assign a value to the deliveryman_id variable (replace with your logic to retrieve the ID)
  deliveryman_id := generate_deliveryman_id('Tahlil','01782633834',1,1);

  -- Print the deliveryman ID
  RAISE NOTICE 'Deliveryman ID: %', deliveryman_id;
END;
$$











/***************************************************************/
-- Place order
CREATE OR REPLACE PROCEDURE place_order(
    pizza_id INT,
    topping_id INT,
    branch_id INT,
    type_id INT,
    address VARCHAR(100),
    userid INT
)
AS $$
DECLARE
    total_price DOUBLE PRECISION := 0;
    pizza_price DOUBLE PRECISION;
    topping_price DOUBLE PRECISION;
    order_id INT;
BEGIN
    SELECT price INTO pizza_price
    FROM pizzas
    WHERE pizzaid = pizza_id;

    SELECT price INTO topping_price
    FROM toppings
    WHERE toppingid = topping_id;

    total_price := pizza_price + topping_price;

    -- Insert into orders table
    INSERT INTO orders (customerid, typeid, total, datetime, address, branchid, status)
    VALUES (userid, type_id, total_price, NOW(), address, branch_id, 0)
    RETURNING orderid INTO order_id;

    -- Insert into orderpizzatopping table
    INSERT INTO orderpizzatopping (orderid, pizzaid, toppingid)
    VALUES (order_id, pizza_id, topping_id);
END
$$ LANGUAGE plpgsql;


-- testing
DO $$
BEGIN
    -- Call the place_order procedure with the desired parameter values
    CALL place_order(1, 1, 1, 1, 'Amar Basha', 1);
END $$;

select * from orders;
select * from orderpizzatopping;



/*************************************************************************/

