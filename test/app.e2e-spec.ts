// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
// import { AppModule } from './../src/app.module';
//
// describe('AppController (e2e)', () => {
//   let app: INestApplication;
//
//   beforeEach(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();
//
//     app = moduleFixture.createNestApplication();
//     await app.init();
//   });
//
//   it('/ (GET)', () => {
//     return request(app.getHttpServer())
//       .get('/')
//       .expect(200)
//       .expect('Hello World!');
//   });
// });
//
//

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";

import { AppModule } from "../src/app.module";
import { INestApplication } from "@nestjs/common";

import { execSync } from "child_process";
import { env } from "process";


let prismaClient: PrismaClient;
let pgContainer: StartedPostgreSqlContainer;
let app: INestApplication;

describe("AppController (e2e)", () => {
  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer()
      // .withDatabase("test_db")
      // .withUser("test_user")
      // .withPassword("pass")
      .start();
    const connectionURI = pgContainer.getConnectionUri();
    console.log("PostgreSQL container started with uri: ", connectionURI);

    prismaClient = new PrismaClient({
      datasourceUrl: connectionURI,
      log: ["query"],
    });

    // prismaClient.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    execSync("npx prisma db push", { env: { ...process.env, DATABASE_URL: connectionURI } });

    // In beforeAll:
    // await exec(`db push`, {
    //   env: { DATABASE_URL: connectionURI }
    // });

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  it("should have created all required tables", async () => {
    const tables: any = await prismaClient.$queryRaw`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables: ", tables);

    const tableNames = tables.map((t) => t.table_name);
    expect(tableNames).toContain("User");
  });
});
