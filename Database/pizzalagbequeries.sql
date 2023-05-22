-- Queries
select * from branches;
select * from branches where branchname='dhaka';
select * from customers;
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

Insert into deliveryman (typeid,name,branchid)
        values (1,'Mr. Muaz',1) returning typeid,name,branchid,avaiability;

select * from branches natural join ordertype;

insert into deliveryman (typeid, name, branchid)
        values(1,'Tahlil',1) returning deliverymanid,name,typeid,branchid,avaiability;