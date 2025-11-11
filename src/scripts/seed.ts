
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../db/data-source';
import { ServiceType } from '../entities/ServiceType';
import { Store } from '../entities/Store';
import { User } from '../entities/User';
import { Favorite } from '../entities/Favorite';
import { UserLocation } from '../entities/UserLocation';

// ---------- helpers ----------
function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randint(min: number, max: number) {
    return Math.floor(rand(min, max + 1));
}

async function upsertServiceType(name: string) {
    const repo = AppDataSource.getRepository(ServiceType);
    let st = await repo.findOne({ where: { name } });
    if (!st) {
        st = repo.create({ id: randomUUID(), name });
        await repo.save(st);
        console.log(`✔ service_type: ${name}`);
    } else {
        console.log(`↷ service_type exists: ${name}`);
    }
    return st;
}

async function upsertUser(username: string, email: string, password: string) {
    const repo = AppDataSource.getRepository(User);
    let u = await repo.findOne({ where: [{ username }, { email }]  });
    if (!u) {
        const passwordHash = await bcrypt.hash(password, 10);
        u = repo.create({ username, email, passwordHash } );
        await repo.save(u);
        console.log(`✔ user: ${username} (${u.id})`);
    } else {
        console.log(`↷ user exists: ${username} (${u.id})`);
    }
    return u;
}

async function upsertStore(data: Partial<Store>) {
    const repo = AppDataSource.getRepository(Store);
    let s = await repo.findOne({ where: { name: data.name! } });
    if (!s) {
        s = repo.create({
            id: data.id ?? randomUUID(),
            name: data.name!,
            serviceTypeId: data.serviceTypeId!,
            address: (data as any).address ?? null,
            lat: data.lat!,
            lon: data.lon!,
        } );
        await repo.save(s);
        console.log(`✔ store: ${s.name}`);
    } else {
        console.log(`↷ store exists: ${s.name}`);
    }
    return s;
}

async function addFavorite(userId: string, storeId: string) {
    const repo = AppDataSource.getRepository(Favorite);
    const exists = await repo.findOne({ where: { userId, storeId } as any });
    if (!exists) {
        const fav = repo.create({ userId, storeId } as any);
        await repo.save(fav);
        console.log(`♥ favorite: user ${userId} -> store ${storeId}`);
    } else {
        console.log(`↷ favorite exists: user ${userId} -> store ${storeId}`);
    }
}

async function seedUserLocationsForAllUsers() {
    const repo = AppDataSource.getRepository(UserLocation);
    const users = await AppDataSource.getRepository(User).find();
    if (!users.length) {
        console.log('No users found to seed locations for.');
        return;
    }

    // base around central Bangkok
    const baseLat = 13.736717;
    const baseLon = 100.523186;

    for (const u of users) {
        const count = randint(3, 5); // 3..5 points
        for (let i = 0; i < count; i++) {
            const lat = baseLat + rand(-0.02, 0.02);
            const lon = baseLon + rand(-0.02, 0.02);
            const rec = repo.create({ userId: (u as any).id, lat, lon } as any);
            await repo.save(rec);
        }
        console.log(`📍 seeded ${count} locations for user ${u.id}`);
    }
}

// ---------- main ----------
async function main() {
    const ds = await AppDataSource.initialize();
    try {
        // 1) Service Types
        const cafe = await upsertServiceType('Cafe');
        const pharmacy = await upsertServiceType('Pharmacy');
        const grocery = await upsertServiceType('Grocery');
        const clinic = await upsertServiceType('Clinic');
        const gas = await upsertServiceType('Gas Station');

        // 2) 10 Users
        const users: User[] = [];
        for (let i = 1; i <= 10; i++) {
            const username = `user${i}`;
            const email = `user${i}@example.com`;
            const u = await upsertUser(username, email, 'password123');
            users.push(u);
        }

        // 3) Stores (example coords around Bangkok)
        const storesData = [
            { name: 'Sukhumvit Cafe', serviceTypeId: cafe.id, address: 'Sukhumvit 31, Bangkok', lat: 13.7385, lon: 100.5670 },
            { name: 'Ekkamai Pharmacy', serviceTypeId: pharmacy.id, address: 'Ekkamai 10, Bangkok', lat: 13.7293, lon: 100.5903 },
            { name: 'Thonglor Grocery', serviceTypeId: grocery.id, address: 'Thonglor 13, Bangkok', lat: 13.7328, lon: 100.5804 },
            { name: 'Asok Clinic', serviceTypeId: clinic.id, address: 'Asok Montri Rd, Bangkok', lat: 13.7382, lon: 100.5618 },
            { name: 'Phetchaburi Gas', serviceTypeId: gas.id, address: 'Phetchaburi Rd, Bangkok', lat: 13.7489, lon: 100.5730 },
        ];

        const storeRecords: Store[] = [];
        for (const s of storesData) {
            storeRecords.push(await upsertStore(s as any));
        }

        // 4) Favorites for each user (2–3 random stores)
        for (const u of users) {
            const favCount = randint(2, 3);
            const pick = [...storeRecords];
            // simple shuffle
            for (let i = pick.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pick[i], pick[j]] = [pick[j], pick[i]];
            }
            for (const s of pick.slice(0, favCount)) {
                await addFavorite((u as any).id, s.id as any);
            }
        }

        // 5) User locations for ALL users
        await seedUserLocationsForAllUsers();

        console.log('\n✅ Seed complete for 10 users.');
    } finally {
        await ds.destroy();
    }
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
