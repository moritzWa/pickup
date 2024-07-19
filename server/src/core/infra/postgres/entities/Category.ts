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
import { CategorySlug, Category as CategoryName, Token } from "./Token";

@Entity({
    name: "categories",
})
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "slug",
    })
    @Index("categories_slug_idx")
    slug!: CategorySlug;

    @Column({
        nullable: false,
        type: "text",
        name: "name",
    })
    name!: CategoryName;

    @Column({
        nullable: false,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "banner_image_url",
    })
    bannerImageUrl!: string;

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
