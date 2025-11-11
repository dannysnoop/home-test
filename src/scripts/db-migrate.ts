import 'reflect-metadata';
import {AppDataSource} from "../db/data-source";

(async () => {
    try {
        const ds = await AppDataSource.initialize();
        const res = await ds.runMigrations({ transaction:'each' });
        console.log('Executed migrations:', res.map(m => m.name));
        await ds.destroy();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
