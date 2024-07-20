import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Unique,
} from "typeorm";

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
