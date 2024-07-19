import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    Relation,
    Index,
    Unique,
    OneToMany,
} from "typeorm";
import { Category, Token } from "./Token";

export enum EventType {
    TwitterSpace = "twitter_space",
}

@Entity({
    name: "events",
})
export class Event {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token_id" })
    token!: Relation<Token>;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token_id",
    })
    tokenId!: string;

    @Column({
        nullable: false,
        type: "enum",
        default: null,
        enum: EventType,
        enumName: "event_type",
        name: "type",
    })
    type!: EventType;

    @Column({
        nullable: false,
        type: "text",
        name: "title",
    })
    title!: string;

    @Column({
        default: "",
        nullable: false,
        type: "text",
        name: "link",
    })
    link!: string;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "start_time",
    })
    startTime!: Date;

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
