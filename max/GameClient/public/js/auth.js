import {parseJwt} from "./util.js";

const tempJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTBGQjFDNC1EMDdDLTRGQ0YtOTMyMi1BQzlBODRFMTVEMUIiLCJkaXNwbGF5TmFtZSI6IkFkbWluIFVzZXIiLCJ1c2VybmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmRvbWFpbi5jb20iLCJyb2xlcyI6WyJhZG1pbiIsInBsYXllciJdLCJpYXQiOjE1MTYyMzkwMjJ9.eDG4gEab29dGOzhePuyDGYbfNZBsc3akyrt7i1pr-To";

export const loginUser = async ({username, password}) => {
    return User.fromJwt(tempJwt);
};

export const signupUser = async ({username, email, password}) => {
    return User.fromJwt(tempJwt);
}

export class User {
    constructor(id, username, email, roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    static fromJwt(token) {
        const { payload } = parseJwt(token);
        return new User(payload.sub, payload.username, payload.email, payload.roles);
    }
}