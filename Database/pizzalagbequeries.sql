-- Queries
INSERT INTO branches (branchname)
                        VALUES ('dhaka');
select * from branches;
select * from branches where branchname='dhaka';
select * from customers;
select * from customers where customeremail=$1
INSERT INTO customers (firstname,lastname,customeremail,customerphone,customerpassword,branchid)
                    VALUES ($1, $2, $3, $4, $5,$6)
                    RETURNING firstname,lastname,customeremail,customerphone,customerpassword,branchid