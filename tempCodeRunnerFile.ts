await sequelize.authenticate();
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log(tables);