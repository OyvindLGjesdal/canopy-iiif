import React from "react";
import Link from "next/link";
import Nav from "@/components/Nav/Nav";
import { Content, Title, Wrapper } from "@/components/Header/Header.styled";
import collections from "@/.canopy/collections.json";
import { Label } from "@samvera/nectar-iiif";
import Search from "../Search/Search";
import { Actions } from "./Header.styled";

const navItems = [
  { path: "/works", text: "Works", type: "link" },
  { path: "/about", text: "About", type: "link" },
];

const Header = () => {
  return (
    <Wrapper>
      <Content>
        <Title>
          <Link href="/">
            <Label label={collections[0].label} as="span" />
          </Link>
        </Title>
        <Actions>
          <Search />
          <Nav items={navItems} />
        </Actions>
      </Content>
    </Wrapper>
  );
};

export default Header;
