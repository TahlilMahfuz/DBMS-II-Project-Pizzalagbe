-- Queries
select * from branches;
select * from ordertype;
select * from deliveryman;
select * from branches where branchname='dhaka';
select * from customers;
select * from toppings;
select * from customers where customeremail=$1
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






-- Funtions and procedures

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








