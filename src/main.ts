/**
 * Hello world
 * main account: 7yEjEiMaofpXmodYAJKqU1z2pzNKtSj7HRk1yL9bPxa1
 * dummy account: CA9XJDNKv5UAJWPVPJNPPWD7B4QPHZWV2boiGwAm2X2W
 * default account: EWoyZ3nK7uXPhetpbVhoexzynYTjDfYLnYTqq9GTqwaD
 * contract account: GKR72VqvGEtkMzAxeDmLwTt27cdjWbQdDbd7a13uhJnE
 */

import {
    establishConnection,
    establishPayer,
    checkProgram,
    sayHello,
    reportGreetings,
} from './hello_world';

async function main() {
    console.log("Let's say hello to a Solana account...");

    // Establish connection to the cluster
    await establishConnection();

    // Determine who pays for the fees
    await establishPayer();

    // Check if the program has been deployed
    await checkProgram();

    // Say hello to an account
    await sayHello();

    // Find out how many times that account has been greeted
    await reportGreetings();

    console.log('Success');
}

main().then(
    () => process.exit(),
    err => {
        console.error(err);
        process.exit(-1);
    },
);
