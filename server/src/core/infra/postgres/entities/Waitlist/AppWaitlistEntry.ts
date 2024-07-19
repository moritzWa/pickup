import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Relation,
    Unique,
    Index,
} from "typeorm";
import { User } from "../User";
import { AccountProvider, TransactionType } from "../types";

export const APP_WAITLIST_TYPE = "app";
export const CREATE_MEMECOIN_WAITLIST_TYPE = "create_memecoin";
export const WAITLIST_TYPE_VALUES = [
    APP_WAITLIST_TYPE,
    CREATE_MEMECOIN_WAITLIST_TYPE,
];
export const DEFAULT_WAITLIST_TYPE = APP_WAITLIST_TYPE;

@Entity({
    name: "app_waitlist_entries",
})
@Unique("app_waitlist_entries_email_idx", ["email"])
export class AppWaitlistEntry {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "email",
    })
    email!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "twitter",
    })
    twitter!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "friend_email",
    })
    friendEmail!: string;

    // extra field from the user - e.g. why they want to join
    @Column({
        default: "",
        nullable: false,
        type: "text",
        name: "extra",
    })
    extra!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "type",
        default: DEFAULT_WAITLIST_TYPE,
    })
    type!: string;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
        default: () => "NOW()",
    })
    createdAt!: Date;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
        default: () => "NOW()",
    })
    updatedAt!: Date;
}
