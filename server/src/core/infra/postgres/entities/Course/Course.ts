import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Unique,
    JoinColumn,
    ManyToOne,
    Relation,
} from "typeorm";
import { Character } from "../Character";

@Entity({
    name: "courses",
})
export class Course {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "title",
        type: "text",
    })
    title!: string;

    @Column({
        nullable: false,
        name: "subtitle",
        type: "text",
    })
    subtitle!: string;

    @Column({
        nullable: false,
        name: "image_url",
        type: "text",
    })
    imageUrl!: string;

    @Column({
        nullable: false,
        name: "text_color",
        type: "text",
    })
    textColor!: string;

    @Column({
        nullable: false,
        name: "background_color",
        type: "text",
    })
    backgroundColor!: string;

    @Column({
        nullable: true,
        name: "default_character_id",
        type: "uuid",
    })
    defaultCharacterId!: Maybe<string>;

    @ManyToOne(() => Character, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "default_character_id" })
    character!: Relation<Character | null>;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;

    @DeleteDateColumn({
        name: "deleted_at",
    })
    deletedAt?: Date;
}
